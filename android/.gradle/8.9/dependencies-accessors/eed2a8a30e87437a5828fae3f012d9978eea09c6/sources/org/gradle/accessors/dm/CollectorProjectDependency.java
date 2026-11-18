package org.gradle.accessors.dm;

import org.gradle.api.NonNullApi;
import org.gradle.api.artifacts.ProjectDependency;
import org.gradle.api.internal.artifacts.dependencies.ProjectDependencyInternal;
import org.gradle.api.internal.artifacts.DefaultProjectDependencyFactory;
import org.gradle.api.internal.artifacts.dsl.dependencies.ProjectFinder;
import org.gradle.api.internal.catalog.DelegatingProjectDependency;
import org.gradle.api.internal.catalog.TypeSafeProjectDependencyFactory;
import javax.inject.Inject;

@NonNullApi
public class CollectorProjectDependency extends DelegatingProjectDependency {

    @Inject
    public CollectorProjectDependency(TypeSafeProjectDependencyFactory factory, ProjectDependencyInternal delegate) {
        super(factory, delegate);
    }

    /**
     * Creates a project dependency on the project at path ":collector:instrumented-test-collector"
     */
    public Collector_InstrumentedTestCollectorProjectDependency getInstrumentedTestCollector() { return new Collector_InstrumentedTestCollectorProjectDependency(getFactory(), create(":collector:instrumented-test-collector")); }

    /**
     * Creates a project dependency on the project at path ":collector:test-data-uploader"
     */
    public Collector_TestDataUploaderProjectDependency getTestDataUploader() { return new Collector_TestDataUploaderProjectDependency(getFactory(), create(":collector:test-data-uploader")); }

    /**
     * Creates a project dependency on the project at path ":collector:unit-test-collector"
     */
    public Collector_UnitTestCollectorProjectDependency getUnitTestCollector() { return new Collector_UnitTestCollectorProjectDependency(getFactory(), create(":collector:unit-test-collector")); }

}
